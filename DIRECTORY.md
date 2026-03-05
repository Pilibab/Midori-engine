<pre>
/midori-engine
├── src/                <-- The "Engine"
│   ├── index.ts        <-- Exports everything
│   ├── core/           <-- Pointer events & Canvas setup
│   ├── math/           <-- Anchor logic & Normalization
│   └── types.ts        <-- TypeScript interfaces
├── example/            <-- A separate Vite app to TEST the engine
│   ├── main.tsx
│   └── App.tsx         <-- Imports from "../src/index.ts"
├── package.json
├── vite.config.ts
└── tsconfig.json
</pre>