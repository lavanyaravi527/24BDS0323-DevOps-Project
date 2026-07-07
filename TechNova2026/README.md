# TechNova 2026 — College Technical Symposium Website

A static, dependency-free multi-page website (HTML/CSS/vanilla JS) for a
college technical symposium, packaged to be easy to containerize and to
deploy on Kubernetes for a DevOps assignment.

```
TechNova2026/
├── index.html            Home
├── about.html             History, mission, committee, FAQ
├── events.html             Tracks & events
├── speakers.html            Speaker grid
├── schedule.html             3-day timeline (tabs)
├── gallery.html               Photo grid + lightbox
├── register.html              Validated registration form
├── contact.html                 Validated contact form
├── css/style.css                 Shared design system
├── js/script.js                    Shared behaviour (nav, countdown, forms, tabs)
├── images/                          Drop real photos here (see images/README.txt)
├── Dockerfile                       Multi-stage build → nginx:alpine
├── nginx.conf                        Server config (port 8080, healthz, gzip)
├── .dockerignore
├── docker-compose.yml                 Local one-command run
├── Jenkinsfile                         CI/CD pipeline: build → push → deploy → smoke test
└── k8s/                                 Kubernetes manifests
    ├── namespace.yaml
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── hpa.yaml
    └── kustomization.yaml
```

## Run it locally, no Docker

Just open `index.html` in a browser, or serve it so relative fetches work:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Run it with Docker

```bash
docker build -t technova2026:1.0.0 \
  --build-arg APP_VERSION=1.0.0 \
  --build-arg GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo local) \
  .

docker run --rm -p 8080:8080 technova2026:1.0.0
# visit http://localhost:8080
```

Or with Compose:

```bash
docker compose up --build
```

The container:
- Serves on port **8080** (not 80) so it can run as a non-root user.
- Exposes `/healthz` for readiness/liveness probes.
- Ships a `build-info.json` (version, git sha, build time) baked in at
  build time — the footer's small badge reads it, so you can visually
  confirm which build/pod you're looking at.
- Runs `nginx` as UID 1001 with a read-only root filesystem.

## CI/CD with Jenkins

A `Jenkinsfile` at the repo root drives the full pipeline: checkout →
sanity check → `docker build` → optional `docker push` → `kubectl apply -k k8s/`
→ smoke test. To wire it up:

1. In Jenkins: **New Item → Pipeline** (or a Multibranch Pipeline if you
   want every branch built).
2. Under **Pipeline**, choose **Pipeline script from SCM**, point it at
   this GitHub repo, branch `main`, script path `Jenkinsfile`.
3. If you want the Docker Push stage to run, add a
   **Username/Password** credential in Jenkins named
   `dockerhub-credentials` (your Docker Hub username + an access token),
   and set the `DOCKERHUB_REPO` build parameter to
   `<your-dockerhub-username>/technova2026`. Leave it blank to skip the
   push and only build+deploy locally.
4. Add a GitHub webhook (Settings → Webhooks → payload URL
   `http://<jenkins-host>/github-webhook/`) or enable **Poll SCM** so a
   push to `main` automatically triggers a new build — this is what
   satisfies the assignment's "automated deployment on every commit"
   requirement.
5. The agent running the pipeline needs `docker` and `kubectl` on its
   `PATH` and a working kubeconfig (e.g. pointing at Minikube or your
   cluster).

For your report screenshots: capture the **Jenkins Dashboard**, the
**job configuration** screen, the **console output** of a build, and a
**green "Success" build** in the build history.

## Push to a registry

```bash
docker tag technova2026:1.0.0 <your-registry>/technova2026:1.0.0
docker push <your-registry>/technova2026:1.0.0
```

Update the image reference in `k8s/kustomization.yaml` (or `k8s/deployment.yaml`)
to point at `<your-registry>/technova2026:1.0.0`.

## Deploy to Kubernetes

Using `kubectl` with Kustomize (built into `kubectl` since 1.14):

```bash
kubectl apply -k k8s/
```

Or apply the manifests individually:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

Check it came up:

```bash
kubectl -n technova get pods,svc,ingress,hpa
kubectl -n technova rollout status deployment/technova-web
```

### Trying it on Minikube

```bash
minikube start
minikube addons enable ingress
eval $(minikube docker-env)          # build the image inside Minikube's Docker
docker build -t technova2026:1.0.0 .
kubectl apply -k k8s/
minikube ip                          # note the IP
echo "<minikube-ip> technova.local" | sudo tee -a /etc/hosts
open http://technova.local           # or curl it
```

### What's in the K8s setup, and why

| Manifest             | Purpose                                                              |
|----------------------|-----------------------------------------------------------------------|
| `namespace.yaml`      | Isolates the app's resources under `technova`.                       |
| `deployment.yaml`      | 2 replicas, rolling updates with zero downtime, CPU/memory requests & limits, readiness/liveness probes on `/healthz`, non-root + read-only-root-filesystem security context. |
| `service.yaml`          | Stable ClusterIP in front of the pods.                              |
| `ingress.yaml`           | Routes external traffic (`technova.local`) to the Service.         |
| `hpa.yaml`                | Autoscales 2→6 pods once average CPU exceeds 70%.                 |
| `kustomization.yaml`        | Single entrypoint (`kubectl apply -k k8s/`) that wires it all together and lets you swap the image tag in one place. |

## Notes for your assignment write-up

- The site has **zero build step and zero runtime dependencies** — it's
  plain HTML/CSS/JS, so the Dockerfile only needs to copy files into an
  `nginx:alpine` base, keeping the image small and the CI pipeline simple.
- The `Dockerfile`'s first stage (`meta`) is a good place to point out
  multi-stage builds if your assignment asks for one, even though this
  app doesn't need compilation.
- Swap the placeholder photos in `images/` for real ones any time —
  nothing else needs to change (see `images/README.txt`).
- The registration and contact forms currently validate client-side only
  and don't call a backend. If your assignment wants a full stack, point
  `js/script.js`'s form submit handlers at an API and add that service
  as a second Deployment + Service in `k8s/`.
