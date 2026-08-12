// LaTeX snippet palette for the Math Helper popover.
// Every `latex` string is already `$...$`-delimited so it can be inserted
// directly into a plain text field without any math-context detection.
// Empty `{}` pairs are placeholders — insertSnippetAtCursor() parks the
// cursor inside the first one so the user can type straight into it.

export interface MathSnippet {
  label: string;
  latex: string;
}

export interface MathSnippetCategory {
  name: string;
  snippets: MathSnippet[];
}

export const MATH_SNIPPET_CATEGORIES: MathSnippetCategory[] = [
  {
    name: 'Algebra & Fractions',
    snippets: [
      { label: 'Fraction', latex: '$\\frac{}{}$' },
      { label: 'Power', latex: '$x^{}$' },
      { label: 'Subscript', latex: '$x_{}$' },
      { label: 'Square root', latex: '$\\sqrt{}$' },
      { label: 'nth root', latex: '$\\sqrt[n]{}$' },
      { label: 'Plus/minus', latex: '$\\pm$' },
      { label: 'Times ×', latex: '$\\times$' },
      { label: 'Divide ÷', latex: '$\\div$' },
      { label: 'Not equal', latex: '$\\neq$' },
      { label: 'Approx ≈', latex: '$\\approx$' },
      { label: 'Less/equal', latex: '$\\leq$' },
      { label: 'Greater/equal', latex: '$\\geq$' },
    ],
  },
  {
    name: 'Physics',
    snippets: [
      { label: 'Vector', latex: '$\\vec{}$' },
      { label: 'Unit (N/m²)', latex: '$\\mathrm{N/m^{2}}$' },
      { label: 'Unit (m/s²)', latex: '$\\mathrm{m/s^{2}}$' },
      { label: 'Degree ° ', latex: '$^{\\circ}$' },
      { label: 'Ohm Ω', latex: '$\\Omega$' },
      { label: 'Delta Δ', latex: '$\\Delta$' },
      { label: 'Sum Σ', latex: '$\\sum_{}^{}$' },
      { label: 'Partial derivative', latex: '$\\frac{\\partial }{\\partial }$' },
      { label: 'Infinity ∞', latex: '$\\infty$' },
    ],
  },
  {
    name: 'Chemistry',
    snippets: [
      { label: 'Equilibrium ⇌', latex: '$\\rightleftharpoons$' },
      { label: 'Yields →', latex: '$\\rightarrow$' },
      { label: 'Reversible ⇄', latex: '$\\leftrightarrow$' },
      { label: 'Subscript (H₂O)', latex: '$\\mathrm{H_{2}O}$' },
      { label: 'Charge (2+)', latex: '$\\mathrm{}^{2+}$' },
      { label: 'Charge (2-)', latex: '$\\mathrm{}^{2-}$' },
      { label: 'Delta (heat) Δ', latex: '$\\Delta$' },
      { label: 'Aqueous (aq)', latex: '$\\mathrm{(aq)}$' },
      { label: 'Precipitate ↓', latex: '$\\downarrow$' },
      { label: 'Gas ↑', latex: '$\\uparrow$' },
    ],
  },
  {
    name: 'Greek Letters',
    snippets: [
      { label: 'alpha α', latex: '$\\alpha$' },
      { label: 'beta β', latex: '$\\beta$' },
      { label: 'gamma γ', latex: '$\\gamma$' },
      { label: 'theta θ', latex: '$\\theta$' },
      { label: 'lambda λ', latex: '$\\lambda$' },
      { label: 'mu μ', latex: '$\\mu$' },
      { label: 'pi π', latex: '$\\pi$' },
      { label: 'sigma σ', latex: '$\\sigma$' },
      { label: 'phi φ', latex: '$\\phi$' },
      { label: 'omega ω', latex: '$\\omega$' },
      { label: 'Delta Δ', latex: '$\\Delta$' },
      { label: 'Sigma Σ', latex: '$\\Sigma$' },
    ],
  },
  {
    name: 'Calculus',
    snippets: [
      { label: 'Limit', latex: '$\\lim_{x \\to }$' },
      { label: 'Integral', latex: '$\\int_{}^{} \\, dx$' },
      { label: 'Derivative', latex: '$\\frac{d}{dx}$' },
      { label: 'Product', latex: '$\\prod_{}^{}$' },
      { label: 'sin', latex: '$\\sin()$' },
      { label: 'cos', latex: '$\\cos()$' },
      { label: 'tan', latex: '$\\tan()$' },
      { label: 'log', latex: '$\\log()$' },
      { label: 'ln', latex: '$\\ln()$' },
    ],
  },
  {
    name: 'SSC/HSC Common',
    snippets: [
      { label: 'Quadratic formula', latex: '$x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}$' },
      { label: 'sin²+cos²=1', latex: '$\\sin^{2}\\theta + \\cos^{2}\\theta = 1$' },
      { label: 'Newton\'s 2nd law', latex: '$F = ma$' },
      { label: 'Kinetic energy', latex: '$E_k = \\frac{1}{2}mv^{2}$' },
      { label: 'Ideal gas law', latex: '$PV = nRT$' },
      { label: 'Ohm\'s law', latex: '$V = IR$' },
      { label: 'Molarity', latex: '$M = \\frac{n}{V}$' },
      { label: 'pH', latex: '$pH = -\\log[H^{+}]$' },
      { label: 'Einstein', latex: '$E = mc^{2}$' },
      { label: 'Density', latex: '$\\rho = \\frac{m}{V}$' },
    ],
  },
];
