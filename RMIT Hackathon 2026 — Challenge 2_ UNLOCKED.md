# RMIT Hackathon 2026 — Challenge 2: UNLOCKED

## General description

**Challenge 2 is Tide’s UNLOCKED challenge.** Teams choose a useful possibility that is held back by a trust, privacy, or security problem, then build a small working prototype using **TideCloak** to show how reducing that trust bottleneck makes the idea possible. The challenge is open-ended: Tide does not require every team to build the same kind of app or choose a particular industry.

The central question is: **What could people do if an administrator, organization, server, or AI could not unilaterally override the rules protecting their data or decisions?** Teams should pick one concrete example and demonstrate it in a prototype.

## What teams are expected to build

Build a **small working prototype with TideCloak integrated**. Demonstrate one compelling possibility and explain why limiting unilateral control matters to it. The prototype does not need to be a finished product. Teams may use synthetic data and mocked systems.

TideCloak is Tide’s identity, permission, and data-protection system. The challenge highlights **Emergent Authority**: a sensitive action should only be possible when the required identity, policy, and approvals align, rather than because one administrator or service holds an all-powerful key.

A basic login page by itself is not enough. Tide’s challenge page says to develop the idea further if the app would work exactly the same with ordinary login and backend permissions. The prototype should make TideCloak’s contribution to the core use case visible and credible. Teams should describe only the protections they actually integrated and tested.

## Suggested working sequence

1. Choose one useful possibility currently limited by a trust, privacy, or security concern.
2. Connect a coding agent to Tide’s MCP for integration guidance, or start from TideCloak’s Quickstart.
3. Build a focused prototype with TideCloak, synthetic data, and mocked external systems as needed.
4. Demonstrate the prototype working and explain what becomes possible because no single party can override the relevant safeguards.

## What to submit

Submit a **public GitHub repository** containing the prototype and a **two-minute MP4 demo video under 100 MB**. Submit the repository link through Tide’s form. Put Tide’s five-prompt project overview at the top of the README and keep that overview to **300 words or fewer**; put setup instructions in a separate section. Check the official challenge page for the applicable venue deadline and current submission instructions.

The README overview prompts cover:

- Vision and originality: what the team proposes and what makes it distinctive.
- Trust constraint insight: what is difficult or risky today and what changes when the constraint is removed.
- Value and impact: who benefits and why it matters.
- Why TideCloak matters: how the integration enables the idea.
- Prototype and storytelling: what the prototype demonstrates and what judges should watch for.

## What judges should understand from the demo

The demo and README should make four things clear: the possibility the team chose, the trust constraint that holds it back, the prototype working with TideCloak, and what changes for the people using it. Keep the story focused on one convincing demonstration rather than a large feature set.

## Instructions for Claude Code

Use this file to understand the general requirements of Challenge 2. Do not assume a specific app idea from this description. Before changing project files, inspect the existing repository and preserve any working TideCloak starter. Follow Tide’s current documentation or MCP guidance for integration; do not invent TideCloak APIs or claim untested security guarantees. The team will choose the app idea separately.

## Official resources

- [Tide UNLOCKED — Challenge 2](https://tide.org/unlocked/#challenge)
- [TideCloak overview](https://tide.org/tidecloak)
- [TideCloak Quickstart](https://docs.tide.org/get-started/Tidecloak%20Quickstart)
- [Tide’s coding-agent MCP guidance](https://docs.tide.org/ai-agent-pack)
