# Dockerfile do PocketBase (backend do CoderBot)
#
# IMPORTANTE: o repo tem um "pocketbase.exe" (binário Windows), que não
# roda em Linux/Render. Aqui baixamos o binário Linux oficial do PocketBase
# direto do GitHub Releases.
#
# Copiamos apenas pb_migrations/ (o schema do banco). NÃO copiamos pb_data/
# (é o banco local de desenvolvimento) — em produção o PocketBase cria um
# banco novo em pb_data/ e aplica as migrations sozinho no primeiro boot.

FROM alpine:3.20

# Ajuste a versão se quiser outra release do PocketBase
ARG PB_VERSION=0.30.0

RUN apk add --no-cache unzip ca-certificates

WORKDIR /pb

RUN wget "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
      -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

# Migrations do projeto (schema do banco: users, classes, class_members, etc.)
COPY pb_migrations ./pb_migrations

# O Render injeta a variável PORT (padrão 10000). O PocketBase escuta nela.
ENV PORT=8090
EXPOSE 8090

# pb_data deve ficar num disco persistente (ver render.yaml / instruções),
# senão os dados somem a cada novo deploy.
CMD ["sh", "-c", "/pb/pocketbase serve --http=0.0.0.0:${PORT} --dir=/pb/pb_data"]
