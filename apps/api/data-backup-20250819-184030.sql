PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Usage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ts" DATETIME NOT NULL,
    "day" DATETIME NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "cost_usd" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO Usage VALUES('cmehkvb1g000013xub5008mvq',1755549540768,1755475200000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','test-user',9,15,24,0.0,1755549540772);
INSERT INTO Usage VALUES('cmehl5pvw000113xutvt94mra',1755550026569,1755475200000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',6,13,19,0.0,1755550026573);
INSERT INTO Usage VALUES('cmehlc8vq000213xu9et2bd89',1755550331122,1755475200000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',6,13,19,0.0,1755550331127);
INSERT INTO Usage VALUES('cmehrmgv40000go7nrbecninc',1755560885721,1755475200000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,14,21,0.0,1755560885728);
INSERT INTO Usage VALUES('cmehrmu7q0001go7ndng8z0gc',1755560903026,1755475200000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',32,27,59,0.0,1755560903030);
INSERT INTO Usage VALUES('cmehsgdgy0002go7nm9jkaxfq',1755562281008,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,14,21,0.0,1755562281011);
INSERT INTO Usage VALUES('cmehsh0lc0003go7n5qbjss4v',1755562310974,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',9,253,262,0.0,1755562310976);
INSERT INTO Usage VALUES('cmehswnqf0004go7nbs8uzy9s',1755563040805,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',9,68,77,0.0,1755563040807);
INSERT INTO Usage VALUES('cmehsx3dz0005go7nkgpfdhwo',1755563061091,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',85,118,203,0.0,1755563061095);
INSERT INTO Usage VALUES('cmehsxkep0006go7nod53s8v1',1755563083151,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',9,63,72,0.0,1755563083153);
INSERT INTO Usage VALUES('cmehsxwao0007go7nfl1egzkx',1755563098557,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,35,42,0.0,1755563098560);
INSERT INTO Usage VALUES('cmehsyboa0008go7n1wv1wasy',1755563118485,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',50,225,275,0.0,1755563118491);
INSERT INTO Usage VALUES('cmeht5vf50009go7nv800t1tx',1755563470670,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',9,26,35,0.0,1755563470674);
INSERT INTO Usage VALUES('cmehtet8n000ago7n8bqdr675',1755563887748,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,116,123,0.0,1755563887751);
INSERT INTO Usage VALUES('cmehtubj0000bgo7nv8md8xbh',1755564611288,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,81,88,0.0,1755564611293);
INSERT INTO Usage VALUES('cmehu9hno000cgo7nhdbh36i5',1755565319074,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',6,14,20,0.0,1755565319076);
INSERT INTO Usage VALUES('cmehumuxg000dgo7ntkfgunu8',1755565942801,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',5,36,41,0.0,1755565942804);
INSERT INTO Usage VALUES('cmehuno0d000ego7nnnmquxvs',1755565980487,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',10,374,384,0.0,1755565980493);
INSERT INTO Usage VALUES('cmehv1ld00000t5fb22csdqo8',1755566630243,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',NULL,NULL,NULL,0.0,1755566630245);
INSERT INTO Usage VALUES('cmehvfbba00001toqjb9p1sof',1755567270396,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,440,447,0.0,1755567270407);
INSERT INTO Usage VALUES('cmehvgcwz00011toqvs0cx947',1755567319137,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',12,223,235,0.0,1755567319140);
INSERT INTO Usage VALUES('cmeiew81p0000ke1t0lpyftfk',1755599972026,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,14,21,0.0,1755599972030);
INSERT INTO Usage VALUES('cmeiewmhb0001ke1t2w80l3wn',1755599990734,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',34,53,87,0.0,1755599990736);
INSERT INTO Usage VALUES('cmeiex4hx0002ke1tg7xi8s7r',1755600014083,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',13,46,59,0.0,1755600014086);
INSERT INTO Usage VALUES('cmeiexhp40003ke1tia2f2v90',1755600031188,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',8,65,73,0.0,1755600031192);
INSERT INTO Usage VALUES('cmeigmscu0000bjkvs9ji90g6',1755602891017,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,14,21,0.0,1755602891022);
INSERT INTO Usage VALUES('cmeih6t6p0001bjkvq0qmgwxw',1755603825215,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,14,21,0.0,1755603825217);
INSERT INTO Usage VALUES('cmeih70q40002bjkvycan45b8',1755603834984,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',30,27,57,0.0,1755603834988);
INSERT INTO Usage VALUES('cmeihz4iq0003bjkvrf5c8m48',1755605146272,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',9,187,196,0.0,1755605146274);
INSERT INTO Usage VALUES('cmeii01ub0004bjkv8ey83k65',1755605189455,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,13,20,0.0,1755605189459);
INSERT INTO Usage VALUES('cmeilwia20000111a4pwp9gcm',1755611742598,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,14,21,0.0,1755611742602);
INSERT INTO Usage VALUES('cmeiqy34f0000bb8t2wdh12be',1755620214333,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,15,22,0.0,1755620214351);
INSERT INTO Usage VALUES('cmej0qcjf0000jmwn5vg9npxx',1755636649462,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',7,13,20,0.0,1755636649467);
INSERT INTO Usage VALUES('cmej0vzc20001jmwner9nwiao',1755636912288,1755561600000,'deepseek','deepseek-chat','cmehiuy290000oetwvnpv4jkg','cmehiuy2a0002oetwcbmzy0mp',8,15,23,0.0,1755636912290);
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
, "stripeCustomerId" TEXT);
INSERT INTO Organization VALUES('cmehiij3u00024nsq4jxm24kg','flowagencyai''s Organization',1755545585466,NULL);
INSERT INTO Organization VALUES('cmehim0jt00054nsqvu3lyzs7','flowagencyai''s Organization',1755545748041,NULL);
INSERT INTO Organization VALUES('cmehiuy290000oetwvnpv4jkg','flowagencyai''s Organization',1755546164721,NULL);
INSERT INTO Organization VALUES('test-org','test-org',1755611512548,NULL);
INSERT INTO Organization VALUES('test-org-123','Usuario Teste',1755627238392,'cus_SthRouRCdlKZ0F');
INSERT INTO Organization VALUES('test-org-integration','Usuario Teste Integração',1755627311878,'cus_SthSHbA2MdXfJX');
INSERT INTO Organization VALUES('test-org-free','Usuario Free',1755627312774,'cus_SthSqWdXEjEqwv');
INSERT INTO Organization VALUES('test-user-456','Usuário Teste',1755627965037,'cus_SthdPa3zLQF0JC');
INSERT INTO Organization VALUES('cmehiuy2a0002oetwcbmzy0mp','flowagencyai',1755628150449,'cus_SthgiE8CmZHf3Z');
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "orgId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "emailVerified" DATETIME, "image" TEXT,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO User VALUES('cmehiuy2a0002oetwcbmzy0mp','flowagencyai@gmail.com',NULL,'cmehiuy290000oetwvnpv4jkg',1755546164723,1755636712173,NULL);
INSERT INTO User VALUES('test-user-456','teste@chatterfy.com','Usuário Teste','test-org-123',1755627900856,NULL,NULL);
CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyCreditsTokens" INTEGER NOT NULL,
    "dailyTokenLimit" INTEGER NOT NULL,
    "storageLimitMB" INTEGER NOT NULL,
    "maxFileSizeMB" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
, "stripePriceId" TEXT, "stripeProductId" TEXT);
INSERT INTO "Plan" VALUES('cmeh7fl830000jahc6hcagyej','free','Grátis',2000000,200000,200,10,'{"rag":false,"s3":false}',1755526972464,'price_1RxtyxBIe5afQs219axTXInV','prod_SthNTZXOmvBSbf');
INSERT INTO "Plan" VALUES('cmeh7fl8i0001jahc0tfu0s6m','pro','Pro',10000000,1000000,2000,50,'{"rag":true,"s3":true}',1755526972483,'price_1RxtyxBIe5afQs21EeEke3mT','prod_SthNcjxc65tUzV');
CREATE TABLE IF NOT EXISTS "Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "title" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Thread_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "FileAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "userId" TEXT,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileAsset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Session VALUES('cmehiuy2c0004oetwe7prvx1r','043e23ec-7d3a-4142-883d-561fea046a19','cmehiuy2a0002oetwcbmzy0mp',1758138164724);
INSERT INTO Session VALUES('cmej0roxe0001113bnfupu5f0','645f01e4-ed97-4af0-89cd-2214caa23379','cmehiuy2a0002oetwcbmzy0mp',1758228712176);
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
INSERT INTO VerificationToken VALUES('marceloamorym@ymail.com','9169c3805d94c549bcde073dea1c3f50d79e249a10756ef6535c8fb208302c1c',1755631235205);
INSERT INTO VerificationToken VALUES('flowagencyai@gmail.com','5b097ee724ae4831f7b40b75c3b069c31647e356f4a7c4c90844a6c49cc80b91',1755631339952);
INSERT INTO VerificationToken VALUES('teste.email@exemplo.com','a93d19e1ab2cb8cfc893faff6ba996f316e08f3587955588e67705e7a170f3b3',1755631895315);
INSERT INTO VerificationToken VALUES('test1755545694113@exemplo.com','e88de0e000ad6454a39f5cd41ba013d9a111239dcde723da4ed88f2fdca6c4b4',1755632095270);
INSERT INTO VerificationToken VALUES('flowagencyai@gmail.com','78a698b5a11c3b0e2a1c52f4db441186d0d51ce576a3bd8c9b4179d8f2a15bc9',1755632827785);
INSERT INTO VerificationToken VALUES('teste@exemplo.com','9e5e952d7ae36247342c22ed12f197a368ad493b8272281928c647ca5f49aa91',1755640436859);
INSERT INTO VerificationToken VALUES('teste2@exemplo.com','249ff9d11e27bce33f218e4bb91376c4297fbe54b9664d969ad14a9dfc17299a',1755640504358);
INSERT INTO VerificationToken VALUES('flowagencyai@gmail.com','9329468878159b334b2c9123aa0907fab7bb5f7f8e09db44e23edd2170cea89c',1755648526426);
INSERT INTO VerificationToken VALUES('test@example.com','8228dc88ec95d39b67f9e3f849440e92eeb4e5b15e0ef155057fa80a446f73ac',1755705392908);
CREATE TABLE IF NOT EXISTS "StripeWebhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    "error" TEXT
);
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "periodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" DATETIME NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT,
    "stripeStatus" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "retentionOffersCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetentionOfferAt" DATETIME,
    "trialEnd" DATETIME,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO Subscription VALUES('cmehkqx2a0003ywlr0d3ow0cf','cmehiuy290000oetwvnpv4jkg','cmeh7fl8i0001jahc0tfu0s6m',0,1755549336033,1758141336033,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,1755549336034,'2025-08-19 14:14:16');
INSERT INTO Subscription VALUES('cmeilrktv0003mxoaktb115gq','test-org','cmeh7fl8i0001jahc0tfu0s6m',1,1755611512612,1758203512612,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,1755611512627,'2025-08-19 14:14:16');
INSERT INTO Subscription VALUES('cmeilymq20002111a3o1ow8gr','cmehiuy290000oetwvnpv4jkg','cmeh7fl830000jahc6hcagyej',1,1755611841673,1758203841673,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,1755611841674,'2025-08-19 14:14:16');
INSERT INTO Subscription VALUES('cmeivsusb00012kglrlh09hh2','test-org-123','cmeh7fl830000jahc6hcagyej',1,1755628368343,1787164368343,NULL,NULL,NULL,'active',0,NULL,NULL,0,NULL,NULL,NULL,NULL,1755628368348,1755628368348);
INSERT INTO Subscription VALUES('cmeiw05df00032kglpl6a4d9k','cmehiuy2a0002oetwcbmzy0mp','cmeh7fl830000jahc6hcagyej',1,1755628708658,1787164708658,NULL,NULL,NULL,'active',0,NULL,NULL,0,NULL,NULL,NULL,NULL,1755628708659,1755628708659);
CREATE INDEX "Usage_orgId_day_idx" ON "Usage"("orgId", "day");
CREATE INDEX "Usage_provider_model_day_idx" ON "Usage"("provider", "model", "day");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");
CREATE INDEX "FileAsset_orgId_idx" ON "FileAsset"("orgId");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE UNIQUE INDEX "StripeWebhook_stripeEventId_key" ON "StripeWebhook"("stripeEventId");
CREATE INDEX "StripeWebhook_eventType_processed_idx" ON "StripeWebhook"("eventType", "processed");
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");
CREATE UNIQUE INDEX "Plan_stripePriceId_key" ON "Plan"("stripePriceId");
COMMIT;
