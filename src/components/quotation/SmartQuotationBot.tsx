import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Printer,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../backend';
import { computeQuotation } from '../../utils/quotationEngine';
import { usePricingConfig, usePricingRules, useAdditionalServices, useSettings } from '../../hooks/useData';
import { BUDGET_RANGES, DESIGN_PREFS, MATERIAL_PREFS, PROJECT_TYPES, SCOPES } from '../../lib/constants';
import { savePendingQuotation } from '../../lib/pendingQuotation';
import { writeAuditLog, notifyUser, notifyAdmins } from '../../lib/activity';
import { openQuotationPdf } from '../../lib/quotationPdf';
import { Button, ProgressBar, Spinner } from '../ui';
import QuotationResultView from './QuotationResultView';
import { cn } from '../../lib/cn';
import type { AdditionalService, Quotation, QuotationInputs } from '../../types';

interface ChatMessage {
  id: number;
  role: 'bot' | 'user';
  text: string;
  options?: string[];
  multi?: boolean;
  result?: Quotation;
}

interface StepDef {
  key: string;
  prompt: string;
  options?: string[];
  input?: 'number';
  multi?: boolean;
}

const STEPS: StepDef[] = [
  { key: 'welcome', prompt: 'Welcome to AG Construction Builders! I can help you generate a preliminary estimate for your project. Let us start with a few quick questions.' },
  { key: 'projectType', prompt: 'What type of project are you planning?', options: [...PROJECT_TYPES] },
  { key: 'scopeOfWork', prompt: 'What is the scope of work?', options: [...SCOPES] },
  { key: 'floorArea', prompt: 'What is the estimated floor area? (in square meters)', input: 'number' },
  { key: 'floors', prompt: 'How many floors will the structure have?', input: 'number' },
  { key: 'materialPreference', prompt: 'What is your material preference?', options: [...MATERIAL_PREFS] },
  { key: 'designPreference', prompt: 'What design style do you prefer?', options: [...DESIGN_PREFS] },
  { key: 'budgetRange', prompt: 'What is your estimated budget range?', options: [...BUDGET_RANGES] },
  { key: 'additionalServices', prompt: 'Would you like to add any additional services?', multi: true },
  { key: 'review', prompt: 'All set! Generate your preliminary estimate below.' },
];

let messageCounter = 0;

export default function SmartQuotationBot({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { config } = usePricingConfig();
  const { pricingRules } = usePricingRules(true);
  const { additionalServices } = useAdditionalServices(true);
  const { settings } = useSettings();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuotationInputs>>({});
  const [selectedAdditional, setSelectedAdditional] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Quotation | null>(null);
  const [busy, setBusy] = useState(false);
  const savedIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: ++messageCounter, role: 'bot', text: STEPS[0].prompt, options: STEPS[0].options }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, generating]);

  const step = STEPS[stepIndex];
  const progress = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  function push(msg: ChatMessage) {
    setMessages((prev) => [...prev, msg]);
  }

  function advance(nextAnswer?: string) {
    const key = step.key;
    if (key !== 'welcome' && nextAnswer !== undefined) {
      setAnswers((prev) => ({
        ...prev,
        [key]: parseStepValue(key, nextAnswer),
      }));
    }
    const nextIndex = stepIndex + 1;
    if (nextIndex >= STEPS.length) {
      void generateEstimate();
      return;
    }
    const nextStep = STEPS[nextIndex];
    setStepIndex(nextIndex);
    setInputValue('');
    setInputError(null);
    setSelectedAdditional([]);
    push({ id: ++messageCounter, role: 'bot', text: nextStep.prompt, options: nextStep.options, multi: nextStep.multi });
  }

  function parseStepValue(key: string, value: string): string | number {
    if (key === 'floorArea' || key === 'floors') return Number(value);
    return value;
  }

  function handleOption(option: string) {
    if (step.key === 'welcome') {
      advance();
      return;
    }
    push({ id: ++messageCounter, role: 'user', text: option });
    advance(option);
  }

  function handleInputSubmit() {
    if (step.key === 'floorArea') {
      const value = Number(inputValue);
      if (!Number.isFinite(value) || value <= 0) {
        setInputError('Please enter a valid floor area greater than zero.');
        return;
      }
      push({ id: ++messageCounter, role: 'user', text: `${value} sqm` });
      advance(String(value));
      return;
    }
    if (step.key === 'floors') {
      const value = Number(inputValue);
      if (!Number.isFinite(value) || value < 1) {
        setInputError('Please enter a valid number of floors (1 or more).');
        return;
      }
      push({ id: ++messageCounter, role: 'user', text: `${value} floor${value > 1 ? 's' : ''}` });
      advance(String(value));
      return;
    }
    if (step.key === 'review') {
      void generateEstimate();
      return;
    }
    push({ id: ++messageCounter, role: 'user', text: inputValue });
    advance(inputValue);
  }

  function handleAdditionalContinue() {
    const count = selectedAdditional.length;
    push({
      id: ++messageCounter,
      role: 'user',
      text: count === 0 ? 'No additional services' : `${count} additional service${count > 1 ? 's' : ''} selected`,
    });
    setAnswers((prev) => ({ ...prev, additionalServiceIds: selectedAdditional }));
    advance();
  }

  function handleBack() {
    if (result) {
      setResult(null);
      savedIdRef.current = null;
      setStepIndex(STEPS.length - 1);
      setMessages((prev) => prev.slice(0, -1));
      return;
    }
    if (stepIndex === 0) return;
    if (stepIndex === 1) {
      setMessages((prev) => prev.slice(0, -1));
      setStepIndex(0);
      return;
    }
    setMessages((prev) => prev.slice(0, -2));
    setStepIndex((prev) => prev - 1);
    setInputValue('');
    setInputError(null);
  }

  function resetAll() {
    setMessages([{ id: ++messageCounter, role: 'bot', text: STEPS[0].prompt, options: STEPS[0].options }]);
    setStepIndex(0);
    setAnswers({});
    setSelectedAdditional([]);
    setInputValue('');
    setInputError(null);
    setResult(null);
    savedIdRef.current = null;
  }

  async function generateEstimate() {
    if (!config) {
      toast.error('Pricing configuration is still loading. Please try again.');
      return;
    }
    if (generating) return;
    setGenerating(true);
    try {
      const inputs: QuotationInputs = {
        projectType: (answers.projectType as string) ?? 'Residential',
        scopeOfWork: (answers.scopeOfWork as string) ?? 'Full Construction',
        floorArea: Number(answers.floorArea ?? 120),
        floors: Number(answers.floors ?? 2),
        materialPreference: (answers.materialPreference as string) ?? 'Standard',
        designPreference: (answers.designPreference as string) ?? 'Modern',
        budgetRange: (answers.budgetRange as string) ?? '₱2M – ₱5M',
        additionalServiceIds: answers.additionalServiceIds ?? [],
        specialRequests: answers.specialRequests,
      };
      const quotation = computeQuotation(inputs, {
        rules: pricingRules,
        config,
        additionalServices,
        clientId: user?.uid ?? '',
        clientName: user?.fullName ?? 'Guest Client',
        clientEmail: user?.email,
      });
      setResult(quotation);
      push({ id: ++messageCounter, role: 'bot', text: 'Here is your preliminary estimate:', result: quotation });
    } catch {
      toast.error('Unable to generate the estimate. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function persistQuotation(): Promise<Quotation | null> {
    if (!result) return null;
    if (savedIdRef.current) {
      const existing = await db.quotations.get(savedIdRef.current);
      if (existing) return existing;
    }
    if (!user) {
      savePendingQuotation(result);
      return null;
    }
    const saved = await db.quotations.create({
      ...result,
      clientId: user.uid,
      clientName: user.fullName,
      clientEmail: user.email,
      status: 'Submitted',
    });
    savedIdRef.current = saved.id;
    await writeAuditLog({ actor: user }, 'quotation_generated', 'quotation', saved.id, {
      number: saved.quotationNumber,
      total: saved.totalEstimate,
    });
    await notifyUser({
      userId: user.uid,
      audience: 'client',
      title: 'Quotation saved',
      message: `Your quotation ${saved.quotationNumber} has been saved to your account.`,
      type: 'quotation',
      referenceId: saved.id,
      link: `/client/quotations/${saved.id}`,
    });
    await notifyAdmins({
      title: 'New quotation submitted',
      message: `${user.fullName} generated quotation ${saved.quotationNumber}.`,
      type: 'quotation',
      referenceId: saved.id,
      link: `/admin/quotations/${saved.id}`,
    });
    return saved;
  }

  async function handleSaveQuotation() {
    setBusy(true);
    try {
      const saved = await persistQuotation();
      if (!saved && !user) {
        toast.success('Your quotation was saved temporarily. Log in to keep it permanently.');
        navigate('/login');
        return;
      }
      if (saved) {
        toast.success('Quotation saved successfully');
        navigate(`/client/quotations/${saved.id}`);
      }
    } catch {
      toast.error('Unable to save the quotation. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitInquiry() {
    if (!result) return;
    setBusy(true);
    try {
      const saved = await persistQuotation();
      if (!saved && !user) {
        toast.success('Log in to submit your inquiry.');
        navigate('/login');
        return;
      }
      if (saved) navigate(`/client/inquiries/new?quotationId=${saved.id}`);
    } catch {
      toast.error('Unable to prepare the inquiry. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const activeAdditional = additionalServices.filter((s: AdditionalService) => s.isActive);

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-2xl border border-agdark-100 bg-white shadow-card', compact ? 'h-[560px]' : 'h-[660px]')}>
      {/* Header */}
      <div className="flex items-center gap-3 bg-agdark-800 px-5 py-4 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-agorange">
          <Bot size={18} />
        </span>
        <div className="flex-1">
          <p className="font-display text-base font-bold uppercase tracking-wide">Smart Quotation Assistant</p>
          <p className="text-[11px] text-agdark-300">Guided estimator • deterministic company pricing</p>
        </div>
        <Sparkles size={18} className="text-agorange" />
      </div>

      {/* Progress */}
      <div className="border-b border-agdark-100 px-5 py-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-agdark-400">
          <span className="capitalize">{step.key.replace(/([A-Z])/g, ' $1')}</span>
          <span>{Math.min(progress, 100)}%</span>
        </div>
        <ProgressBar value={Math.min(progress, 100)} className="mt-1.5" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-agdark-50/40 px-4 py-4">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div className={cn('flex items-start gap-2', msg.role === 'user' && 'flex-row-reverse')}>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
                  msg.role === 'bot' ? 'bg-agorange-50 text-agorange' : 'bg-agdark-100 text-agdark-500'
                )}
              >
                {msg.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
              </span>
              <div
                className={cn(
                  'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-6',
                  msg.role === 'bot'
                    ? 'rounded-tl-sm bg-white text-agdark-700 shadow-sm'
                    : 'rounded-tr-sm bg-agblue text-white'
                )}
              >
                {msg.text}
              </div>
            </div>

            {msg.multi ? (
              <div className="ml-9 space-y-2">
                <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                  {activeAdditional.map((s) => (
                    <label
                      key={s.id}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition',
                        selectedAdditional.includes(s.id)
                          ? 'border-agorange bg-agorange-50 text-agdark-800'
                          : 'border-agdark-100 bg-white text-agdark-600 hover:border-agorange/50'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn('flex h-4 w-4 items-center justify-center rounded border', selectedAdditional.includes(s.id) ? 'border-agorange bg-agorange text-white' : 'border-agdark-300 bg-white')}>
                          {selectedAdditional.includes(s.id) ? <Check size={11} /> : null}
                        </span>
                        {s.name}
                      </span>
                      <span className="text-xs font-semibold text-agdark-500">
                        {s.unit === 'per sqm' ? 'per sqm' : 'lump sum'}
                      </span>
                    </label>
                  ))}
                </div>
                <Button size="sm" onClick={handleAdditionalContinue}>
                  Continue <ArrowRight size={14} />
                </Button>
              </div>
            ) : msg.options ? (
              <div className="ml-9 flex flex-wrap gap-2">
                {msg.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOption(option)}
                    className="rounded-full border border-agdark-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-agdark-700 transition hover:border-agorange hover:bg-agorange-50 hover:text-agorange"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}

            {msg.result ? (
              <div className="ml-9">
                <QuotationResultView
                  quotation={msg.result}
                  settings={settings}
                  actions={
                    <>
                      <Button variant="outline" size="sm" onClick={() => openQuotationPdf(msg.result!, settings)}>
                        <Printer size={14} /> Print / PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={resetAll}>
                        <RotateCcw size={14} /> Start new
                      </Button>
                      <Button size="sm" onClick={handleSaveQuotation} loading={busy}>
                        Save quotation
                      </Button>
                      <Button size="sm" variant="dark" onClick={handleSubmitInquiry} loading={busy}>
                        Submit inquiry
                      </Button>
                    </>
                  }
                />
              </div>
            ) : null}
          </div>
        ))}

        {generating ? (
          <div className="flex items-center gap-2 pl-9 text-sm text-agdark-500">
            <Spinner size={16} /> Calculating your estimate…
          </div>
        ) : null}
      </div>

      {/* Input area */}
      {!result ? (
        <div className="border-t border-agdark-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} disabled={stepIndex === 0} className="rounded-lg p-2 text-agdark-400 transition hover:bg-agdark-100 hover:text-agdark-700 disabled:opacity-40" aria-label="Back">
              <ArrowLeft size={16} />
            </button>
            {step.input === 'number' ? (
              <div className="flex flex-1 gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min={1}
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setInputError(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInputSubmit(); }}
                    placeholder={step.key === 'floors' ? 'e.g. 2' : 'e.g. 120'}
                    className="h-10 w-full rounded-lg border border-agdark-200 bg-white px-3 text-sm focus:border-agblue focus:outline-none focus:ring-2 focus:ring-agblue/20"
                  />
                  {inputError ? <p className="mt-1 text-xs text-red-600">{inputError}</p> : null}
                </div>
                <Button onClick={handleInputSubmit}>
                  Send <Send size={14} />
                </Button>
              </div>
            ) : (
              <Button className="flex-1" onClick={() => (step.key === 'additionalServices' ? handleAdditionalContinue() : handleInputSubmit())}>
                {step.key === 'review' ? (
                  <>
                    Generate estimate <Sparkles size={14} />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={14} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
