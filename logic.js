const readline = require('readline');

const verbose = false;
const log = (string, show = verbose) => {
  if (verbose) {
    console.log(string);
  }
};

const calc = {
  // datasets
  hrm: {
    H: { c: 66.4730, kh: 5.0033, kw: 13.7516, ky: -6.7550 },
    R: { c: 88.362, kw: 13.397, kh: 4.799, ky: -5.677 },
    M: { kw: 10.0, kh: 6.25, ky:  -5, c: 5 },
  },
  o: { little: 1.2, light: 1.375, moderate: 1.55, heavy: 1.725, extreme: 1.9 },
  M: v => (-0.0964286 * Math.pow(v, 3)) + (2.95536 * Math.pow(v, 2)) - (30.6679 * v) + 117.371,
  // M: v => 3.5,

  // bmr values
  B: (c, kh, kw, ky, h, w, y, d) => c + (kh * h) + (kw * w) + (ky * y) - d,
  Bv: (B, w) => (B / (24 * 60)) * (1000 / 5.0) * (1 / w),

  // met corrections
  Mc: (M, Bv) => M * (3.5 / Bv),
  Md: (Mc, o) => Mc - o,

  // calories
  C: (B, Md, t) => B * Md * (t / 24),
};

const s = (args) => {
  log('Calculation options:');
  log(args);
  
  const { v, t, h, w, y, e, k, d, a } = args;

  const { c, kh, kw, ky } = calc.hrm[k];
  const o = calc.o[e];
  const M = calc.M(v);
  const B = calc.B(c, kh, kw, ky, h, w, y, d);
  const Bv = calc.Bv(B, w);
  const Mc = a ? calc.Mc(M, Bv) : M;
  const Md = calc.Md(Mc, o);
  
  log('Intermediates:');
  log({ c, kh, kw, ky, o, M, B, Bv, Mc, Md });

  const C = calc.C(B, Md, t / 60);
  log('Result:');
  log({ C });
  
  return C;
}

const snickers = (w, v, t) => {
  // calculations
  const opts = { w, v, t };

  const argc = { y: 30, h: 137.64, e: 'little' };
  const argn = { a: false, d: 0, k: 'M' };
  const argx = { a: false, d: -213.0, k: 'H' };
  const arga = { a: true, d: -213.0, k: 'M' };

  const scn = s(Object.assign({}, opts, argc, argn));
  const scx = s(Object.assign({}, opts, argc, argx));
  const sca = s(Object.assign({}, opts, argc, arga));

  log('Burn:')
  log({ scn, scx, sca })

  log('Relative:')
  const scl = (sca - scn) / sca;
  const scu = (scx - sca) / sca;
  const scb = (scl + scu) / 2;
  log({ scl, scu, scb });

  l = 0.20;
  S = 250;
  Scn = scn / (S * (1 + l));
  Scx = scx / (S * (1 - l));
  Sca = sca / S;

  log('Proportion:')
  log({ S, l });
  log({ Scn, Scx, Sca });

  Scl = (Sca - Scn) / Sca;
  Scu = (Scx - Sca) / Sca;
  Scb = (Scl + Scu) / 2;

  log('Certainty:')
  log({ Scl, Scu, Scb });

  log('Summary')
  console.log(`${sca.toFixed(0)} kcal ± ${(scb * 100).toFixed(2)}%`);
  console.log(`${Sca.toFixed(2)} bars ± ${(Scb * 100).toFixed(2)}%`);
}

const rs = [ 8.0, 6.8, 5.1 ];

const qs = [
  // { w: 60, v: 10.0, t: 30 },
  // { w: 59, v: 9.75, t: 30 },
  // { w: 58, v: 9.50, t: 30 },
  // { w: 57, v: 10.0, t: 35 },
  // { w: 56, v: 9.50, t: 35 },
  // { w: 55, v: 10.0, t: 40 },
  // { w: 54, v: 9.75, t: 40 },
  // { w: 53, v: 10.0, t: 45 },
  // { w: 52, v: 9.50, t: 45 },
  // { w: 52, v: 9.00, t: 45 },
  // { w: 56.6, v: 9.38, t: 30 },
  // { w: 56.6, v: 9.43, t: 30.5 },
  // { w: 56.3, v: 10.0, t: 40 },
  // { w: 56.3, v: 0, t: 60 }
  { w: 58.6, v: 9.5, t: 60 }
]

// qs.forEach(q => {
//   const { w, v, t } = q;
//   const ts = rs.map(r => Math.ceil(r * v));
//   tt = ts.reduce((s, t) => s + t);
//   console.log(`${q.w}kg, ${q.t}min at ${q.v} -> ${ts} = ${(tt / 60).toFixed(2)}hrs`);
//   snickers(w, v, t);
// })

// qs.forEach(q => console.log(`- *x/x*: ${q.w}kg, ${q.t}mins @ ${q.v}min/miles`));


const linein = prompt => new Promise((res, rej) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt
  })
  rl
    .on('line', line => {
      rl.close();
      return res(line.trim())
    })
    .prompt()
});

let options = { w: 0, v: 0, t: 0 }
linein('Weight > ')
  .then((weight) => {
    options.w = weight;
    return linein('Speed > ');
  })
  .then((speed) => {
    options.v = speed;
    return linein('Time > ')
  })
  .then((time) => {
    options.t = time;
    console.log(options);
    return Promise.resolve(options);
  })
  .then((q) => {
    const { w, v, t } = q;
    const ts = rs.map(r => Math.ceil(r * v));
    tt = ts.reduce((s, t) => s + t);
    console.log(`${q.w}kg, ${q.t}min at ${q.v} -> ${ts} = ${(tt / 60).toFixed(2)}hrs`);
    snickers(w, v, t);
  })
  .catch((e => console.error(JSON.stringify(e))));
