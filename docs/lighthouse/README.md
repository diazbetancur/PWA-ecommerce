# Lighthouse Reports

Use the following to generate a report locally:

```bash
# Run the app (production build recommended)
npx nx build ecommerce --configuration=production
npx nx serve-static ecommerce

# In another terminal, run Lighthouse (requires Chrome installed)
npx lighthouse http://localhost:4200 --view --output json --output-path ./docs/lighthouse/report.json
```

Target scores: PWA/Performance/Best Practices/SEO ≥ 90.
