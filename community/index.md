# Community

Slang is fully open-source and all developments for Slang take place within the public [GitHub repo](https://github.com/shader-slang/slang).
If you'd like to contribute to the project, we are excited to have your input.
Please review the following materials to learn more about our community structure and our process for accepting patches.

## Community Discussions

We use the [GitHub discussion page](https://github.com/shader-slang/slang/discussions) for all community announcements and discussions. All community members are welcomed to post questions, ideas, suggestions for new features in the discussion page. We will also use the discussion page to announce or provide update on new feature developments.

## Community Structure

We distinguish in our community between "Community Member", "Committer" and "Owners".

#### Community Member

The term community refers to everyone using Slang or participating in the Slang open source project in any form. All community members are welcome to
report issues, start discussion threads, or submit pull requests.

#### Committer

A committer is a community member who has write access to the Slang repository and can approve pull requests. This is a status that can be earned by maintaining a track record of submitting and landing code changes to the Slang project (see more details on [the process of becoming a committer](/community/become-a-committer).) All community members can review code submitted by other community members, but for a pull request to be considered approved and ready for merging, at least one **owner** (more info below) of each file you are touching must provide an approving review. Ideally a committer should choose reviewers who are familiar with the area of code you are touching. If you have doubts, look at the git blame for the file and the CODEOWNER file.

Submissions to `docs/proposals` are considered **Slang Proposed Features (SPFs)**, and require two *Language Owners* (more info below) to approve the submission.

#### Owner

Every file in the Slang repository has a list of owners. An owner of a directory has the right to approve pull requests touching the directory. A pull request is approved only when at least two owners of each directory affected by the changes have given their approval. If you are a committer and think you’re ready to become an owner of a directory, put up a PR to the relevant OWNERs and get two owners to review it. In case of conflict between owners, owners need to reach consensus amongst themselves.

##### Language Owner

A language owner is the owner of the [`/docs/proposals/`](https://github.com/shader-slang/slang/tree/master/docs/proposals) directory. All new Slang language and core module features (e.g. new language syntax, new functions, or new types in the Slang core module) starts with a design document submitted to this directory. The language and core module design must be approved by two language owners before any implementation pull request for the new language feature can be approved.

## Processes for Code Changes

#### Process for Bug Fixes
A bug fix starts with a GitHub issue describing the bug. Any community member can submit a pull request coming from your personal fork of Slang containing fixes for the bug. Such pull requests needs to be reviewed and approved by two committers who are owners of the files being changed by the pull request. Once the pull request is approved and has passed all CI tests, it can be merged to the main branch.

Pull requests are expected to be reviewed by the committers within 24 hours after they are created or updated, and to close within a week.

#### Process for Slang Feature Changes

Changes that add or modify syntax, language features, Slang's core module, or the compilation and reflection API must go through our process for language changes. The full process is [documented here](/community/language-change-process).

#### Updates for the Processes

The above processes can be updated to meet the changing needs of the Slang project. Updates to these processes can be made via pull request to the [Slang website repository](https://github.com/shader-slang/shader-slang.github.io) after community discussion and with PR approval by at least two Language Owners.

## Submitting a Pull Request

If you are ready to start contributing, please follow our [guide for creating a pull request](https://github.com/shader-slang/slang/blob/master/CONTRIBUTION.md). All pull requests are expected to meet our [bar of code quality](/community/code-quality).

## Become a Committer

If you think you might be ready to be a committer, ask one of the reviewers of your pull request or another committer familiar with your work to see if they will nominate you. They will discuss that in #slang-committers discord — two others in that will need to second the nomination. See [how to become a committer here](/community/become-a-committer).

## Request to Own More Directories

When you are granted committer status, you will be assigned an initial set of directories that you will own based on your record of contribution. As you continue to contribute to the project, you will naturally become the owner for any new directories that you create.

After landing several changes to a specific directory, you can request to be an owner of the directory by submitting a PR to modify the `./github/CODEOWNER` file adding yourself to the owners list. Your PR will go through the same review process and you will become an owner once the PR is approved and merged.