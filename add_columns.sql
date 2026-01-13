
-- Add new columns to reviews table
ALTER TABLE "reviews" ADD COLUMN "stepInToeWidth" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "stepInInstepHeight" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "stepInHeelHold" INTEGER;

ALTER TABLE "reviews" ADD COLUMN "runLightness" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "runSinkDepth" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "runStability" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "runTransition" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "runResponse" INTEGER;

ALTER TABLE "reviews" ADD COLUMN "fatigueSole" TEXT;
ALTER TABLE "reviews" ADD COLUMN "fatigueCalf" TEXT;
ALTER TABLE "reviews" ADD COLUMN "fatigueKnee" TEXT;
ALTER TABLE "reviews" ADD COLUMN "fatigueOther" TEXT;

ALTER TABLE "reviews" ADD COLUMN "sdLanding" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "sdResponse" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "sdStability" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "sdWidth" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "sdDesign" INTEGER;

ALTER TABLE "reviews" ADD COLUMN "onomatopoeia" TEXT;
ALTER TABLE "reviews" ADD COLUMN "purchaseSize" TEXT;

ALTER TABLE "reviews" ADD COLUMN "reviewerGender" TEXT;
ALTER TABLE "reviews" ADD COLUMN "reviewerHeight" DOUBLE PRECISION;
ALTER TABLE "reviews" ADD COLUMN "reviewerWeight" DOUBLE PRECISION;
ALTER TABLE "reviews" ADD COLUMN "reviewerWeeklyDistance" DOUBLE PRECISION;
ALTER TABLE "reviews" ADD COLUMN "reviewerPersonalBest" TEXT;
ALTER TABLE "reviews" ADD COLUMN "reviewerFootShape" TEXT;
ALTER TABLE "reviews" ADD COLUMN "reviewerLandingType" TEXT;
