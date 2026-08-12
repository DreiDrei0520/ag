import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Ruler, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useProjects } from '../../hooks/useData';
import { formatDate } from '../../lib/format';
import { EmptyState, PageLoader } from '../../components/ui';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { projects, loading } = useProjects(true);

  if (loading) return <PageLoader />;
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Project not found" description="This project may have been removed." action={<Link to="/projects" className="btn-secondary">Back to projects</Link>} />
      </div>
    );
  }

  const stats = [
    { label: 'Status', value: project.status, icon: CheckCircle2 },
    { label: 'Location', value: project.location, icon: MapPin },
    { label: 'Area', value: `${project.area} m²`, icon: Ruler },
    { label: 'Completed', value: formatDate(project.completionDate), icon: Calendar },
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-agdark-800">
        <div className="absolute inset-0 blueprint-grid" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-agdark-300 hover:text-white">
            <ArrowLeft size={15} /> All projects
          </Link>
          <p className="eyebrow mt-6">Project portfolio</p>
          <h1 className="mt-2 max-w-3xl font-display text-5xl font-extrabold uppercase tracking-wide text-white">{project.title}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl">
          <img src={project.featuredImage} alt={project.title} className="h-[420px] w-full object-cover" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-agdark-100 bg-white p-4">
              <Icon size={18} className="text-agorange" />
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-agdark-400">{label}</p>
              <p className="mt-0.5 truncate font-display text-base font-bold text-agdark-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">About this project</h2>
            <p className="mt-3 leading-7 text-agdark-600">{project.description}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Project highlights</h2>
            <ul className="mt-3 space-y-2">
              {project.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm leading-6 text-agdark-700">
                  <ChevronRight size={16} className="mt-1 shrink-0 text-agorange" /> {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {project.images.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-agdark-800">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {project.images.map((src, i) => (
                <img key={src} src={src} alt={`${project.title} photo ${i + 1}`} className="h-44 w-full rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 rounded-xl bg-agdark-800 p-8 text-center">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">Looking to build something similar?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-agdark-200">Get a preliminary estimate for your own project in just a few minutes.</p>
          <Link to="/quotation" className="btn-primary mt-5">Start Smart Quotation</Link>
        </div>
      </section>
    </div>
  );
}
