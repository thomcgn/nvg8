# syntax=docker/dockerfile:1.6

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# POM zuerst kopieren (für Dependency Cache)
COPY pom.xml ./

# Dependencies vorladen (ohne Source-Code)
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -e -ntp -DskipTests dependency:go-offline \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn

# Source Code kopieren
COPY src ./src

# Build
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -e -ntp -DskipTests package \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn

# Runtime Image
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]