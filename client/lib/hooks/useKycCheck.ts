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
  const { data, isLoading } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/users/kyc/status");
        return {
          status: res.data?.status || KycStatus.NOT_SUBMITTED,
          isFrozen: !!res.data?.user?.isFrozen,
        };
      } catch (err) {
        return {
          status: KycStatus.NOT_SUBMITTED,
          isFrozen: false,
        };
      }
    },
  });

  const kycStatus = data?.status || KycStatus.NOT_SUBMITTED;
  const isKycApproved = kycStatus === KycStatus.APPROVED;
  const isFrozen = !!data?.isFrozen;

  return {
    kycStatus,
    isKycApproved,
    isFrozen,
    isLoading,
  };
}

