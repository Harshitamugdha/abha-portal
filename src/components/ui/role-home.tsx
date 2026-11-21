import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { TopBar } from "./top-bar";

type RoleHomeProps = {
  title: string;
};

export async function RoleHome({ title }: RoleHomeProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  return (
    <>
      <TopBar name={user.name} links={[]} />
      <main className="page">
        <h1>{title}</h1>
        <div className="card">
          <p>You are signed in as {user.name}.</p>
          <p className="muted">This area is being built.</p>
        </div>
      </main>
    </>
  );
}
