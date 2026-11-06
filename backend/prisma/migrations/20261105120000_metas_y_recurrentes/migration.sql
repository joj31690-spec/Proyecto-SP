ALTER TABLE "movimientos" ADD COLUMN "fecha_programada" DATE,
ADD COLUMN "recurrente_id" INTEGER;

CREATE TABLE "metas_ahorro" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "objetivo" DECIMAL(12,2) NOT NULL,
    "fecha_objetivo" DATE,
    "usuario_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "metas_ahorro_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aportes_ahorro" (
    "id" SERIAL NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "nota" VARCHAR(255),
    "meta_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aportes_ahorro_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gastos_recurrentes" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" VARCHAR(50),
    "frecuencia" VARCHAR(20) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "proximo_vencimiento" DATE NOT NULL,
    "dias_aviso" INTEGER NOT NULL DEFAULT 3,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "usuario_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "gastos_recurrentes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "metas_ahorro_usuario_id_idx" ON "metas_ahorro"("usuario_id");
CREATE INDEX "aportes_ahorro_meta_id_idx" ON "aportes_ahorro"("meta_id");
CREATE INDEX "gastos_recurrentes_usuario_id_proximo_vencimiento_idx" ON "gastos_recurrentes"("usuario_id", "proximo_vencimiento");
CREATE UNIQUE INDEX "movimientos_recurrente_id_fecha_programada_key" ON "movimientos"("recurrente_id", "fecha_programada");

ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_recurrente_id_fkey" FOREIGN KEY ("recurrente_id") REFERENCES "gastos_recurrentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "metas_ahorro" ADD CONSTRAINT "metas_ahorro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aportes_ahorro" ADD CONSTRAINT "aportes_ahorro_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "metas_ahorro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gastos_recurrentes" ADD CONSTRAINT "gastos_recurrentes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gastos_recurrentes" ADD CONSTRAINT "gastos_recurrentes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
