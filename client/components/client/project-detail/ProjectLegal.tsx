const legalDocs = [
  { name: "Giấy phép xây dựng", size: "2.4 MB", type: "PDF" },
  { name: "Quy hoạch 1/500", size: "5.1 MB", type: "PDF" },
];
import { Gavel, FileText, Download } from "lucide-react";

export default function ProjectLegal() {
  return (
    <section className="space-y-4">
      <h2 className="text-h4 font-black flex items-center gap-2">
        <Gavel className="text-primary" />
        Hồ sơ pháp lý
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {legalDocs.map((doc, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <FileText className="text-red-500 text-h4" />
              <div>
                <p className="font-bold text-smaller">{doc.name}</p>
                <p className="text-smallest text-slate-500">
                  {doc.size} • {doc.type}
                </p>
              </div>
            </div>
            <Download className="text-slate-400 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>
    </section>
  );
}
