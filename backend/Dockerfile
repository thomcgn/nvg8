# syntax=docker/dockerfile:1.6

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# POM zuerst kopieren (für Dependency Cache)
COPY pom.xml ./

RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -e -DskipTests package \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn

# Source Code kopieren
COPY src ./src

# Build mit vollständigen Logs
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -e -DskipTests package \
    -Dorg.slf4j.simpleLogger.defaultLogLevel=warn
# Runtime Image
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]