package com.ewallet.payment.dto;

import java.util.List;

public class QrVerifyResponse {

    private String receiverName;
    private String receiverPhoto;
    private List<String> currency;

    public QrVerifyResponse() {
    }

    public QrVerifyResponse(String receiverName, String receiverPhoto, List<String> currency) {
        this.receiverName = receiverName;
        this.receiverPhoto = receiverPhoto;
        this.currency = currency;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverPhoto() {
        return receiverPhoto;
    }

    public void setReceiverPhoto(String receiverPhoto) {
        this.receiverPhoto = receiverPhoto;
    }

    public List<String> getCurrency() {
        return currency;
    }

    public void setCurrency(List<String> currency) {
        this.currency = currency;
    }
}
