/* eslint-disable prettier/prettier */
import { z, ZodTypeAny } from "zod";

export const nullableInput = <T extends ZodTypeAny>(
  schema: T,
  message = `O campo deve ser um número.`
) => {
  return schema.nullable().transform((val, ctx) => {
    if (val === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        fatal: true,
        message,
      });
      return null;
    }
    return val;
  });
};
