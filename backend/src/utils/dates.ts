/**
 * Converte um valor já validado por `Joi.date()` de volta pra uma string
 * 'YYYY-MM-DD' — nunca deixa um objeto Date puro chegar no Knex/pg pra uma
 * coluna `date`.
 *
 * Por quê: `Joi.date()` converte a string validada num `Date` (UTC meia-
 * noite, corretamente). Mas o driver `pg` formata um `Date` recebido como
 * parâmetro usando os getters LOCAIS (getFullYear/getMonth/getDate), não
 * UTC — em fuso negativo (ex.: Brasília, UTC-3), meia-noite UTC de um dia
 * vira 21h do dia ANTERIOR no horário local, e é essa data anterior que vai
 * pro Postgres. Resultado: toda data salva um dia adiantada é gravada um
 * dia pra trás (confirmado empiricamente — ver PR que corrigiu isso).
 * `.toISOString().slice(0, 10)` sempre lê os componentes em UTC, então
 * reconstrói a data original corretamente, imune ao fuso da máquina.
 */
export function isoDateOnly(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}
