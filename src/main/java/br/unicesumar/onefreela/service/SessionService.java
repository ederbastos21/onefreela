package br.unicesumar.onefreela.service;

import org.springframework.data.redis.core.RedisTemplate;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class SessionService {
    private final RedisTemplate<String,String> redisTemplate;

     private SessionService (RedisTemplate<String, String> redisTemplate){
        this.redisTemplate = redisTemplate;
    }

    public Boolean storeSession (Long id){
         try{
             String token = UUID.randomUUID().toString();
             String userId = id.toString();
             redisTemplate.opsForValue().set(token,userId,1, TimeUnit.MINUTES);
             return true;
         } catch (Exception e){
             System.out.println("erro: nao pode criar sessao no redis" + e);
             return false;
         }
    }

    public String getSession (String token){
         return redisTemplate.opsForValue().get(token);
    }
    
}
