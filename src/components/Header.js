import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Link,
  Box,
  useMediaQuery
} from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Home as HomeIcon, MenuBook as MenuBookIcon } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  appBar: {
    marginBottom: theme.spacing(3),
    backgroundColor: theme.palette.primary.main,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  title: {
    flexGrow: 1,
    margin: theme.spacing(0, 2),
    color: theme.palette.common.white,
    textDecoration: 'none',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    color: theme.palette.common.white,
    marginRight: theme.spacing(1),
  },
  homeLink: {
    color: theme.palette.common.white,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  },
}));

const Header = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <div className={classes.logo}>
          <IconButton 
            edge="start" 
            component={RouterLink} 
            to="/" 
            className={classes.icon}
            aria-label="Home"
          >
            <MenuBookIcon />
          </IconButton>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            component={RouterLink} 
            to="/" 
            className={classes.title}
          >
            khazāʾin-browser
          </Typography>
        </div>
        
        <Box>
          <Link 
            component={RouterLink} 
            to="/" 
            className={classes.homeLink}
          >
            <HomeIcon className={classes.icon} />
            {!isMobile && <Typography variant="body1">Home</Typography>}
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;