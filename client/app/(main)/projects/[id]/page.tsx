import ProjectGallery from "@/components/client/project-detail/ProjectGallery";
import ProjectTabs from "@/components/client/project-detail/ProjectTabs";
import ProjectSidebar from "@/components/client/project-detail/ProjectSidebar";
import ProjectLegal from "@/components/client/project-detail/ProjectLegal";
import ProjectLocation from "@/components/client/project-detail/ProjectLocation";
export default function ProjectDetailPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-6 font-display">
      <ProjectGallery />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
        <div className="lg:col-span-2 space-y-12">
          <ProjectTabs />
          
          <section>
            <h2 className="text-h4 font-black mb-4 flex items-center gap-2 text-primary dark:text-white">
              <span className="material-symbols-outlined">description</span>
              Mô tả dự án
            </h2>
            <p className="text-body text-slate-600 dark:text-slate-400 leading-relaxed">
              Vinhomes Ocean Park 3 là mảnh ghép cuối cùng của siêu quần thể đô thị biển...
            </p>
          </section>

          <ProjectLegal />
          <ProjectLocation />
        </div>

        <ProjectSidebar />
      </div>
    </main>
  );
}