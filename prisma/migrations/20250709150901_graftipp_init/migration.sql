-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "missed" INTEGER NOT NULL DEFAULT 0,
    "isMax" BOOLEAN NOT NULL DEFAULT false,
    "seasonGamedayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gameday" (
    "id" TEXT NOT NULL,
    "gamedayName" TEXT NOT NULL,
    "orderNumber" INTEGER NOT NULL,

    CONSTRAINT "Gameday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentType" (
    "id" TEXT NOT NULL,
    "paymentTypeName" TEXT NOT NULL,
    "textPositive" TEXT,
    "textNegative" TEXT,

    CONSTRAINT "PaymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "booked" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentTypeId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonGameday" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "gamedayId" TEXT NOT NULL,
    "dateStart" DATE,
    "dateEnd" DATE,

    CONSTRAINT "SeasonGameday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonPlace" (
    "id" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "seasonId" TEXT NOT NULL,

    CONSTRAINT "SeasonPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER[],
    "includeMissed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSeason" (
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,

    CONSTRAINT "UserSeason_pkey" PRIMARY KEY ("userId","seasonId")
);

-- CreateTable
CREATE TABLE "UserName" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserName_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bet_userId_seasonGamedayId_key" ON "Bet"("userId", "seasonGamedayId");

-- CreateIndex
CREATE UNIQUE INDEX "Gameday_gamedayName_key" ON "Gameday"("gamedayName");

-- CreateIndex
CREATE UNIQUE INDEX "Gameday_orderNumber_key" ON "Gameday"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentType_paymentTypeName_key" ON "PaymentType"("paymentTypeName");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonGameday_seasonId_gamedayId_key" ON "SeasonGameday"("seasonId", "gamedayId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonPlace_seasonId_place_key" ON "SeasonPlace"("seasonId", "place");

-- CreateIndex
CREATE UNIQUE INDEX "Season_year_key" ON "Season"("year");

-- CreateIndex
CREATE UNIQUE INDEX "UserName_userId_userName_key" ON "UserName"("userId", "userName");

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_seasonGamedayId_fkey" FOREIGN KEY ("seasonGamedayId") REFERENCES "SeasonGameday"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "PaymentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonGameday" ADD CONSTRAINT "SeasonGameday_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonGameday" ADD CONSTRAINT "SeasonGameday_gamedayId_fkey" FOREIGN KEY ("gamedayId") REFERENCES "Gameday"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonPlace" ADD CONSTRAINT "SeasonPlace_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeason" ADD CONSTRAINT "UserSeason_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSeason" ADD CONSTRAINT "UserSeason_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserName" ADD CONSTRAINT "UserName_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
