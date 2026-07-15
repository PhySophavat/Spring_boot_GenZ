package com.ewallet.auth.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.junit.jupiter.api.BeforeEach;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end test for POST /api/auth/register. Verifies that newly registered
 * users receive an auto-generated wallet whose walletId is "FW" + 6-digit
 * walletNumber, and that two distinct users each get a unique wallet.
 */
@SpringBootTest
@ActiveProfiles("test")
class AuthControllerIT {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("Register: response carries walletId = FW + 6-digit walletNumber")
    void register_assignsFwPrefixedSixDigitWalletId() throws Exception {
        String body = """
            {
              "fullName": "Alice Test",
              "phoneNumber": "+85510000010",
              "email": "alice-it@test.com",
              "password": "Password123",
              "confirmPassword": "Password123"
            }
            """;

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.message").value("Registration successful"))
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.user.id").exists())
            .andExpect(jsonPath("$.user.walletIdString").exists())
            .andExpect(jsonPath("$.user.walletNumber").exists())
            .andReturn();

        JsonNode user = objectMapper.readTree(result.getResponse().getContentAsString())
            .get("user");
        String walletNumber = user.get("walletNumber").asText();
        String walletIdString = user.get("walletIdString").asText();

        assertThat(walletNumber).matches("^\\d{6}$");
        assertThat(walletIdString).isEqualTo("FW" + walletNumber);
        System.out.println(">>> REGISTER user1 -> walletNumber=" + walletNumber + ", walletIdString=" + walletIdString);
    }

    @Test
    @DisplayName("Register: two distinct users receive two distinct FW+6-digit wallet ids")
    void register_twoUsers_getDistinctWalletIds() throws Exception {
        MvcResult resultA = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "fullName": "Bob First",
                      "phoneNumber": "+85510000011",
                      "email": "bob-first@test.com",
                      "password": "Password123",
                      "confirmPassword": "Password123"
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn();

        MvcResult resultB = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "fullName": "Bob Second",
                      "phoneNumber": "+85510000012",
                      "email": "bob-second@test.com",
                      "password": "Password123",
                      "confirmPassword": "Password123"
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode a = objectMapper.readTree(resultA.getResponse().getContentAsString()).get("user");
        JsonNode b = objectMapper.readTree(resultB.getResponse().getContentAsString()).get("user");

        String aWalletNumber = a.get("walletNumber").asText();
        String bWalletNumber = b.get("walletNumber").asText();
        String aWalletIdString = a.get("walletIdString").asText();
        String bWalletIdString = b.get("walletIdString").asText();

        // Both numbers are exactly 6 digits and well-formed.
        assertThat(aWalletNumber).matches("^\\d{6}$");
        assertThat(bWalletNumber).matches("^\\d{6}$");
        assertThat(aWalletIdString).isEqualTo("FW" + aWalletNumber);
        assertThat(bWalletIdString).isEqualTo("FW" + bWalletNumber);

        // Two fresh users must receive distinct wallets (no PENDING collision).
        assertThat(aWalletNumber).isNotEqualTo(bWalletNumber);
        assertThat(aWalletIdString).isNotEqualTo(bWalletIdString);
        assertThat(a.get("id").asLong()).isNotEqualTo(b.get("id").asLong());
        System.out.println(">>> REGISTER user2 -> walletNumber=" + bWalletNumber + ", walletIdString=" + bWalletIdString);
        System.out.println(">>> REGISTER user3 -> walletNumber=" + aWalletNumber + ", walletIdString=" + aWalletIdString);
    }
}
