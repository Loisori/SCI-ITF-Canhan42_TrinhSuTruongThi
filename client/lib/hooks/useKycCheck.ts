import { useQuery } from "@tanstack/react-query";
import api from "../axios";
import { UserProfile } from "@/types/user";

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export function useKycCheck() {
  const { data: kycStatus, isLoading } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/users/kyc/status");
        return res.data?.status || KycStatus.NOT_SUBMITTED;
      } catch (err) {
        return KycStatus.NOT_SUBMITTED;
      }
    },
  });

  const isKycApproved = kycStatus === KycStatus.APPROVED;

  return {
    kycStatus,
    isKycApproved,
    isLoading,
  };
}
