export interface Clinic {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  laboratoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}
