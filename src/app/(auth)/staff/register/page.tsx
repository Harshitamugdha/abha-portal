import { listInstitutionsForRegistration } from "@/server/auth/register";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function StaffRegisterPage() {
  const institutions = await listInstitutionsForRegistration();

  return (
    <main className="page">
      <h1>Register as staff</h1>
      <RegisterForm institutions={institutions} />
    </main>
  );
}
