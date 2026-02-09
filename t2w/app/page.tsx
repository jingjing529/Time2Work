"use client";

import { Box, Container, Button, Grow } from '@mui/material';

export default function HomePage() {
    return (
        <Container sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <Box className="content">
                <h2>Time2Work</h2>
                <h2>Time2Work</h2>
            </Box>
            <Grow in timeout={800}>
                <Button 
                    href="/api/auth/google" 
                    variant="contained" 
                    size="large"
                    sx={{ mt: 4 }}
                >
                    Login with Google
                </Button>
            </Grow>
        </Container>
    );
}
