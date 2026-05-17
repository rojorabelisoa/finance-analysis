package com.rojorabelisoa.finance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FinanceAnalysisApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinanceAnalysisApplication.class, args);
    }
}
