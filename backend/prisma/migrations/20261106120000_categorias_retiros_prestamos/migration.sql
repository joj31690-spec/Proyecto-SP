ALTER TABLE "aportes_ahorro"
ADD COLUMN "movimiento_id" INTEGER,
ADD COLUMN "solicitud" VARCHAR(80),
ADD COLUMN "tipo" VARCHAR(20) NOT NULL DEFAULT 'aporte';
ALTER TABLE "categorias" ADD COLUMN "archivada" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "movimientos" ADD COLUMN "naturaleza" VARCHAR(20) NOT NULL DEFAULT 'ordinario',
ALTER COLUMN "categoria_id" DROP NOT NULL;

CREATE TABLE "prestamos" (
  "id" SERIAL NOT NULL,
  "persona" VARCHAR(100) NOT NULL,
  "tipo" VARCHAR(20) NOT NULL,
  "monto" DECIMAL(12,2) NOT NULL,
  "fecha" DATE NOT NULL,
  "vencimiento" DATE,
  "nota" VARCHAR(255),
  "usuario_id" INTEGER NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pagos_prestamo" (
  "id" SERIAL NOT NULL,
  "clase" VARCHAR(20) NOT NULL,
  "capital" DECIMAL(12,2) NOT NULL,
  "intereses" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "fecha" DATE NOT NULL,
  "nota" VARCHAR(255),
  "solicitud" VARCHAR(80) NOT NULL,
  "prestamo_id" INTEGER NOT NULL,
  "movimiento_id" INTEGER,
  "interes_movimiento_id" INTEGER,
  CONSTRAINT "pagos_prestamo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "prestamos_usuario_id_idx" ON "prestamos"("usuario_id");
CREATE UNIQUE INDEX "pagos_prestamo_solicitud_key" ON "pagos_prestamo"("solicitud");
CREATE UNIQUE INDEX "pagos_prestamo_movimiento_id_key" ON "pagos_prestamo"("movimiento_id");
CREATE UNIQUE INDEX "pagos_prestamo_interes_movimiento_id_key" ON "pagos_prestamo"("interes_movimiento_id");
CREATE INDEX "pagos_prestamo_prestamo_id_idx" ON "pagos_prestamo"("prestamo_id");
CREATE UNIQUE INDEX "aportes_ahorro_solicitud_key" ON "aportes_ahorro"("solicitud");
CREATE UNIQUE INDEX "aportes_ahorro_movimiento_id_key" ON "aportes_ahorro"("movimiento_id");
ALTER TABLE "aportes_ahorro" ADD CONSTRAINT "aportes_ahorro_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos_prestamo" ADD CONSTRAINT "pagos_prestamo_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos_prestamo" ADD CONSTRAINT "pagos_prestamo_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pagos_prestamo" ADD CONSTRAINT "pagos_prestamo_interes_movimiento_id_fkey" FOREIGN KEY ("interes_movimiento_id") REFERENCES "movimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
