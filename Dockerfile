FROM python:3.12-slim

ARG SKILLSPECTOR_REF=224ba292d91b9e5fc59398fc38ab8971f9ab01ec

RUN apt-get update \
 && apt-get install -y --no-install-recommends git nodejs \
 && rm -rf /var/lib/apt/lists/* \
 && pip install --no-cache-dir "git+https://github.com/NVIDIA/skillspector.git@${SKILLSPECTOR_REF}"

WORKDIR /app
COPY package.json server.js ./
COPY api ./api
COPY public ./public

RUN useradd -m tracer
USER tracer

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
