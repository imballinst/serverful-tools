# Serverful Tools

A website containing various toolkits.

## GitLab

### GitLab Pipelines

If your organization is using GitLab only for pipelines (but the code is elsewhere), the experience is painful because you can't filter by trigger variables in GitLab. This tool allows you to fetch and filter the pipelines. It's doing 1 + N calls (1 request to fetch pipeline variable for each pipeline), but the N calls is cached.
