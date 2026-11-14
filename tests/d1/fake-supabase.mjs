// Stand-in for src/lib/supabase.ts in client-module tests: records every call of the query builder and answers from `answers`.
export const calls = [];
export const answers = new Map(); // table -> { data, error }  (or function(callsOfThisQuery) => { data, error })
export const rpcAnswers = new Map();
const builder = (table) => {
  const steps = [];
  const b = new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === 'then') {
        return (res, rej) => {
          calls.push({ table, steps });
          const a = answers.get(table);
          const out = typeof a === 'function' ? a(steps) : a ?? { data: [], error: null };
          return Promise.resolve(out).then(res, rej);
        };
      }
      return (...args) => { steps.push([prop, ...args]); return b; };
    },
  });
  return b;
};
export const supabase = {
  from: (t) => builder(t),
  rpc: async (name, args) => { calls.push({ rpc: name, args }); const a = rpcAnswers.get(name); if (a instanceof Error) throw a; return a ?? { data: null, error: { message: 'missing' } }; },
};
export const reset = () => { calls.length = 0; answers.clear(); rpcAnswers.clear(); };
