package org.thomcgn.backend.admin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;

import javax.sql.DataSource;

@Service
public class DemoResetService {

    private static final Logger log = LoggerFactory.getLogger(DemoResetService.class);

    private final DataSource dataSource;

    public DemoResetService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Vom Endpoint aufgerufen – prüft SYSTEM_ADMIN. */
    public void reset() {
        var principal = SecurityUtils.principalOptional();
        if (principal == null || !principal.isSystem()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Only SYSTEM_ADMIN can reset demo data.");
        }
        executeReset();
    }

    /** Automatischer Reset alle 6 Stunden (konfigurierbar via kidoc.demo.reset-cron). */
    @Scheduled(cron = "${kidoc.demo.reset-cron:0 0 */6 * * *}")
    public void scheduledReset() {
        log.info("Demo-Reset gestartet (scheduled)");
        executeReset();
        log.info("Demo-Reset abgeschlossen");
    }

    private void executeReset() {
        var populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("db/migration/R__insert_demo_admin.sql"));
        populator.setSeparator(";");
        populator.execute(dataSource);
    }
}
