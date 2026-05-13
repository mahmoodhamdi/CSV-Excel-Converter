# Deployment — Kubernetes with Helm

For enterprise customers running their own Kubernetes cluster.

**Estimated setup time:** 30 minutes if you already have a cluster.

## Prerequisites

- A working Kubernetes cluster (v1.27+ recommended). EKS, GKE, AKS, or on-prem.
- `kubectl` configured.
- `helm` v3.

## 1. Add the chart repo

```bash
helm repo add mwm https://charts.mwm.eg
helm repo update
```

## 2. Create namespace and secrets

```bash
kubectl create namespace converter

kubectl -n converter create secret generic converter-env \
  --from-literal=UPSTASH_REDIS_REST_URL=https://YOUR-REDIS.upstash.io \
  --from-literal=UPSTASH_REDIS_REST_TOKEN=YOUR-TOKEN \
  --from-literal=NEXT_PUBLIC_SENTRY_DSN=https://YOUR-SENTRY-DSN
```

## 3. Install with default values

```bash
helm install converter mwm/csv-converter \
  --namespace converter \
  --set brand=base \
  --set baseUrl=https://converter.yourdomain.com
```

## 4. Custom values for production

`values-prod.yaml`:

```yaml
brand: accounting-bridge
baseUrl: https://accounting.yourdomain.com

replicaCount: 3

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: accounting.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: converter-tls
      hosts:
        - accounting.yourdomain.com

podDisruptionBudget:
  enabled: true
  minAvailable: 2

env:
  RATE_LIMIT_WINDOW_MS: "60000"
  RATE_LIMIT_MAX_REQUESTS: "1000"

envFromSecret: converter-env

# Pro tier — mount API keys file
volumeMounts:
  - name: api-keys
    mountPath: /data
    readOnly: true
volumes:
  - name: api-keys
    secret:
      secretName: converter-api-keys
```

Apply:

```bash
helm upgrade --install converter mwm/csv-converter \
  --namespace converter \
  -f values-prod.yaml
```

## 5. Verify

```bash
kubectl -n converter get pods,svc,ingress
kubectl -n converter port-forward svc/converter 3000:80 &
curl http://localhost:3000/api/health
```

## 6. Observability

Recommended:

- **Prometheus** scraping `/api/metrics` (Pro+ tier only)
- **Grafana** dashboard provided in the chart repo (`grafana-dashboard.json`)
- **Loki** for log aggregation
- **Sentry** for error tracking (configured via env var)

## 7. Upgrades

```bash
helm repo update
helm upgrade converter mwm/csv-converter \
  --namespace converter \
  -f values-prod.yaml
```

The chart uses rolling updates by default. Configure `maxUnavailable: 1` for zero-downtime.

## 8. Air-gapped deployment

For environments without internet access:

1. Mirror the Docker image to your internal registry:

   ```bash
   docker pull mwmsoftware/csv-converter-accounting-bridge:latest
   docker tag mwmsoftware/csv-converter-accounting-bridge:latest \
     internal-registry.corp/csv-converter:latest
   docker push internal-registry.corp/csv-converter:latest
   ```

2. Override the image in values:

   ```yaml
   image:
     repository: internal-registry.corp/csv-converter
     tag: latest
     pullSecrets:
       - name: internal-registry-creds
   ```

3. Disable Sentry / external Redis (`Sentry: false`, use in-memory rate limiting).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Pods stuck `ContainerCreating` | Check image pull secret and registry access |
| `429 Too Many Requests` from healthy clients | Bump `RATE_LIMIT_MAX_REQUESTS` or scale replicas |
| Memory throttling on large files | Bump `resources.limits.memory` to 2Gi |
| OOMKilled during xlsx parse | Same — xlsx is RAM-heavy, file size × ~10 |
