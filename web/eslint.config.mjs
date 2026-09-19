// Next 16 ships eslint-config-next as flat config, so it composes directly without the
// eslintrc compatibility shim (which fails on a circular reference in the React plugin).
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "public/data/**", "out/**", "next-env.d.ts"] },
  ...(Array.isArray(coreWebVitals) ? coreWebVitals : [coreWebVitals]),
  ...(Array.isArray(typescript) ? typescript : [typescript]),
];

export default config;
