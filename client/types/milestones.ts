import { ToastState } from "@/types/ui";
import { ProjectDetail } from "@/types/project";

export type ProjectMilestonesProps = {
  project: ProjectDetail;
  role: string | null;
  onUpdate: () => void;
  setToast: (toast: ToastState) => void;
};
