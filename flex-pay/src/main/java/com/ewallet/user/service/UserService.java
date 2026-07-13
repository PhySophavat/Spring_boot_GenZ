package com.ewallet.user.service;

import com.ewallet.user.dto.UserRegistrationRequest;
import com.ewallet.user.dto.UserResponse;
import com.ewallet.user.entity.User;
import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse createUser(UserRegistrationRequest request);
    UserResponse updateUser(Long id, UserRegistrationRequest request);
    void deleteUser(Long id);
    User findById(Long id);
}
