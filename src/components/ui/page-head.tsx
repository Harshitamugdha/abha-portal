type PageHeadProps = {
  kicker: string;
  title: string;
};

export function PageHead({ kicker, title }: PageHeadProps) {
  return (
    <section className="band">
      <div className="container page-head">
        <p className="step-label">{kicker}</p>
        <h1 className="auth-title">{title}</h1>
      </div>
    </section>
  );
}
