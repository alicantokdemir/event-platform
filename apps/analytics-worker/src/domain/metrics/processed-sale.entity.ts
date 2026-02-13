export class ProcessedSaleEntity {
  constructor(
    public readonly saleId: string,
    public readonly processedAt: Date
  ) {}
}
