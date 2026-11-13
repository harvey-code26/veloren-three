# Web Deployment

Target: **GitHub Pages** at <https://harvey-code26.github.io/veloren-three/>.

Automatic deployment is defined in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) and is triggered by each push to `main`. The production build uses `--base=/veloren-three/` so JS/CSS asset URLs resolve under the repository's Pages subpath. It validates the movement tests before deployment.

## One-time hosting setting

GitHub Pages must be enabled for the repository. If the deployment run reports that Pages is not enabled, go to **Settings → Pages → Build and deployment → Source: GitHub Actions** at:

<https://github.com/harvey-code26/veloren-three/settings/pages>

Then re-run the **Deploy to GitHub Pages** workflow under Actions (or push another commit). The GitHub connector cannot change the Pages administration setting directly.

## Verification

1. Check the workflow's **build** and **deploy** jobs are green.
2. Open <https://harvey-code26.github.io/veloren-three/>.
3. Confirm the P1 test field renders; controls work; JS/CSS assets do not 404.
4. Record browser/device results in [`PROGRESS.md`](PROGRESS.md).

Do not treat a completed build as proof the hosted site exists. Site activation and HTTP verification are separate steps.
