# Kubernetes - Translator App

## Struktura plików

```
k8s/
├── 00-namespace.yaml    # Izolacja zasobów
├── 01-secrets.yaml      # Hasła (base64)
├── 02-configmap.yaml    # Konfiguracja
├── 03-postgres.yaml     # Baza danych
├── 04-redis.yaml        # Cache + sesje
├── 05-backend.yaml      # API (3 repliki)
├── 06-frontend.yaml     # React app
└── 07-autoscaling.yaml  # Auto-skalowanie
```

## Wymagania

1. **Docker Desktop** z włączonym Kubernetes:
   - Settings → Kubernetes → Enable Kubernetes
   - Poczekaj aż status będzie "Running"

2. **kubectl** (instaluje się z Docker Desktop)

## Szybki start

### 1. Zbuduj obrazy Docker

```powershell
# Z głównego folderu projektu
docker build -t translator-backend:latest -f backend/Dockerfile .
docker build -t translator-frontend:latest -f frontend/Dockerfile.dev .
```

### 2. Uruchom na Kubernetes

```powershell
# Zastosuj wszystkie pliki (kolejność ważna - dlatego numeracja)
kubectl apply -f k8s/

# Lub pojedynczo:
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-redis.yaml
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-autoscaling.yaml
```

### 3. Sprawdź status

```powershell
# Wszystkie pody
kubectl get pods -n translator

# Oczekiwany wynik:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-6d4b8c7f9-abc12     1/1     Running   0          1m
# backend-6d4b8c7f9-def34     1/1     Running   0          1m
# backend-6d4b8c7f9-ghi56     1/1     Running   0          1m
# frontend-7f8d9e0a1-xyz99    1/1     Running   0          1m
# postgres-5c6d7e8f9-aaa11    1/1     Running   0          1m
# redis-4b5c6d7e8-bbb22       1/1     Running   0          1m

# Serwisy (adresy)
kubectl get services -n translator

# Wszystko
kubectl get all -n translator
```

### 4. Otwórz aplikację

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/graphql

## Przydatne komendy

### Logi

```powershell
# Logi jednego poda
kubectl logs -n translator <nazwa-poda>

# Logi wszystkich backendów
kubectl logs -n translator -l app=backend

# Logi na żywo (follow)
kubectl logs -n translator -l app=backend -f
```

### Skalowanie

```powershell
# Ręczne skalowanie do 5 instancji
kubectl scale deployment backend -n translator --replicas=5

# Sprawdź HPA (auto-scaler)
kubectl get hpa -n translator
```

### Debugowanie

```powershell
# Wejdź do poda (jak SSH)
kubectl exec -it -n translator <nazwa-poda> -- /bin/sh

# Opis poda (eventy, błędy)
kubectl describe pod -n translator <nazwa-poda>

# Sprawdź secrety
kubectl get secrets -n translator
```

### Restart

```powershell
# Restart deploymentu (nowe pody)
kubectl rollout restart deployment backend -n translator

# Status rolloutu
kubectl rollout status deployment backend -n translator
```

### Czyszczenie

```powershell
# Usuń wszystko
kubectl delete namespace translator

# Lub pojedynczo
kubectl delete -f k8s/
```

## Architektura

```
                         Użytkownicy
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌───────────────┐
      │   frontend    │               │    backend    │
      │   Service     │               │    Service    │
      │ (LoadBalancer)│               │ (LoadBalancer)│
      │  :3000        │               │  :4000        │
      └───────┬───────┘               └───────┬───────┘
              │                               │
              ▼                    ┌──────────┼──────────┐
      ┌───────────────┐            │          │          │
      │   frontend    │            ▼          ▼          ▼
      │     Pod       │      ┌─────────┐┌─────────┐┌─────────┐
      └───────────────┘      │ backend ││ backend ││ backend │
                             │  Pod 1  ││  Pod 2  ││  Pod 3  │
                             └────┬────┘└────┬────┘└────┬────┘
                                  │          │          │
                                  └──────────┼──────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                              ▼                             ▼
                      ┌───────────────┐             ┌───────────────┐
                      │    postgres   │             │     redis     │
                      │    Service    │             │    Service    │
                      │  (ClusterIP)  │             │  (ClusterIP)  │
                      └───────┬───────┘             └───────┬───────┘
                              │                             │
                              ▼                             ▼
                      ┌───────────────┐             ┌───────────────┐
                      │   postgres    │             │     redis     │
                      │     Pod       │             │      Pod      │
                      └───────────────┘             └───────────────┘
```

## Kluczowe pojęcia K8s

| Pojęcie        | Co to?                                 | Analogia                                 |
| -------------- | -------------------------------------- | ---------------------------------------- |
| **Pod**        | Najmniejsza jednostka, 1+ kontenerów   | Jeden pracownik                          |
| **Deployment** | Zarządza podami, repliki, aktualizacje | Kierownik zmiany                         |
| **Service**    | Stały adres dla podów, load balancing  | Recepcja (kieruje do wolnego pracownika) |
| **Namespace**  | Izolacja zasobów                       | Osobne piętro w budynku                  |
| **ConfigMap**  | Konfiguracja (plain text)              | Instrukcja na tablicy                    |
| **Secret**     | Wrażliwe dane (base64)                 | Sejf z hasłami                           |
| **PVC**        | Dysk dla danych                        | Szafka na dokumenty                      |
| **HPA**        | Auto-skalowanie                        | Automatyczne zatrudnianie gdy tłok       |
