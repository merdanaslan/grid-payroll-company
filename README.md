# Grid SDK Payroll Company Prototype

A console-based payroll prototype built using the Grid SDK for managing freelancer accounts, smart account creation, and simulated payroll operations.

## Overview

This TypeScript application demonstrates key Grid SDK capabilities including:
- Freelancer account authentication (signup/login)
- Smart account creation and management
- Spending limits and policy configuration
- Simulated USDC payroll operations
- Batch automation concepts

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Grid SDK API key

## Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Copy the environment template and configure your API key:
```bash
cp .env.example .env
```
Then edit `.env` with your actual Grid SDK API key.

## How to Run

```bash
npm run dev
```

## Project Structure

```
src/
├── index.ts           # Main application entry point
├── types/
│   └── index.ts       # TypeScript type definitions
└── utils/
    └── console.ts     # Console UI helper utilities
```

## Usage

1. Run the application with `npm run dev`
2. Choose to create a new freelancer account or login to existing one
3. Follow the OTP verification process via email
4. Explore available features from the main menu

## Grid SDK Reference

This project follows the official Grid SDK documentation:
- [Grid SDK Introduction](https://grid.squads.xyz/grid/v1/accounts/introduction)
- [SDK Reference](https://grid.squads.xyz/grid/v1/sdk-reference/reference/v0.2.0/quickstart)
- [NPM Package](https://www.npmjs.com/package/@sqds/grid)