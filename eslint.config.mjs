import next from "eslint-config-next";

const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "src/vendor/**", "public/**"] },
  {
    rules: {
      // Screens read learner state that is only known on the client; these patterns are intentional there.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
    },
  },
];
export default config;
