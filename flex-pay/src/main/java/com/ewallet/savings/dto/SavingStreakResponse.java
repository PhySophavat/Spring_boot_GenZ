
package com.ewallet.savings.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingStreakResponse {

    private Integer currentStreak;
    private Integer bestStreak;
    private LocalDate lastSavingDate;
    private Integer nextMilestone;
    private Integer daysRemainingToMilestone;
    private List<WeeklyStreakDay> weeklyCalendar;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeeklyStreakDay {
        private String dayName;   // M, T, W, T, F, S, S
        private LocalDate date;
        private Boolean completed;
        private Boolean isToday;
    }
}
