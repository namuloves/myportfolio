/** Ambient type for CSS Module imports (`import styles from "./x.module.css"`).
    Next provides this globally via next-env.d.ts in an app; as a standalone
    package we declare it ourselves so `tsc` and the build resolve the import. */
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
