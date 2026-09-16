-- CreateTable
CREATE TABLE "presupuestos" (
    "id" SERIAL NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presupuestos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_categoria_id_anio_mes_key" ON "presupuestos"("categoria_id", "anio", "mes");

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
