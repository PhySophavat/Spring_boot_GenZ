package com.ewallet.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI flexPayOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Flex Pay API")
                .version("v1")
                .description("User management API for the Flex Pay dashboard.")
                .contact(new Contact().name("Flex Pay Team")));
    }
}
