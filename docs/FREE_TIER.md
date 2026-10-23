# Free-first operation

This foundation needs no paid APIs. It is designed for a public GitHub source
repository, static Pages hosting, and low-frequency Actions runs within the
operator's available quotas. Verify current quotas and account settings before
enabling schedules. No hosting resources have been provisioned by this local build.

Check Settings → Billing and Actions usage, schedule duration, artifact retention,
and inactivity behavior. The daily job has a ten-minute timeout; deploy
and CI have fifteen-minute limits. Stop schedules if they are not useful yet.

ChatGPT/Codex access is for interactive development, not an unrestricted background
LLM API entitlement. This app never attempts to use an interactive session token
on a scheduled runner. No generative API key is required.

Paid SERP tools, hosted LLM APIs, managed authentication, private hosting/databases,
and high-frequency crawling are separate future decisions. Add none silently.

GitHub Pages serves public static data. A truly private analytics UI with secure
in-app mutations requires authenticated server infrastructure. Public repository
Actions artifacts are not a substitute for that privacy boundary.
