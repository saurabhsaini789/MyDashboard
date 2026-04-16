import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    ignores: [
      "src/lib/design-system.tsx",
      "src/components/ui/**/*.{js,jsx,ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\b(text|font|tracking)-/]",
          message:
            "Typography utilities (text-*, font-*, tracking-*) are prohibited. Use <Text>, <PageTitle>, or <SectionTitle> from '@/components/ui/Text' to maintain design consistency.",
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\b(text|font|tracking)-/]",
          message:
            "Typography utilities (text-*, font-*, tracking-*) are prohibited. Use <Text>, <PageTitle>, or <SectionTitle> from '@/components/ui/Text' to maintain design consistency.",
        },
      ],
    },
  },
]);

export default eslintConfig;
