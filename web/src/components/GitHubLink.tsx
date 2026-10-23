import { ExternalLink } from "lucide-react";
export function GitHubLink({
  repository,
  suffix = "/actions",
  children,
}: {
  repository: string | null;
  suffix?: string;
  children: React.ReactNode;
}) {
  return repository ? (
    <a
      className="button"
      href={`${repository}${suffix}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ExternalLink size={14} />
    </a>
  ) : (
    <button
      className="button"
      disabled
      title="Set repositoryUrl in the reviewed public report configuration to enable this link."
    >
      {children}
      <ExternalLink size={14} />
    </button>
  );
}
